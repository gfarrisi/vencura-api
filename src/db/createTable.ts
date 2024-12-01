export const INIT_SCRIPT = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS vencura;

CREATE TABLE IF NOT EXISTS vencura.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT
);

CREATE TABLE IF NOT EXISTS vencura.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES vencura.users(id),
    address VARCHAR(42) NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    encryption_iv BYTEA NOT NULL, 
    is_active BOOLEAN DEFAULT true,
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT,
    is_primary_wallet BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS vencura.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES vencura.wallets(id),
    transaction_hash VARCHAR(66) NOT NULL, -- Ethereum tx hashes are 66 characters (including '0x')
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL, -- Large numeric for Wei amounts
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_vencura_wallets_user_id ON vencura.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_vencura_transactions_wallet_id ON vencura.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vencura_transactions_transaction_hash ON vencura.transactions(transaction_hash);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT;
    RETURN NEW;
END;
$$ language 'plpgsql';


CREATE OR REPLACE FUNCTION vencura.to_unix_timestamp(timestamp_tz TIMESTAMP WITH TIME ZONE)
RETURNS BIGINT AS $$
BEGIN
    RETURN (EXTRACT(EPOCH FROM timestamp_tz) * 1000)::BIGINT;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION vencura.from_unix_timestamp(unix_timestamp BIGINT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN to_timestamp(unix_timestamp / 1000.0);
END;
$$ language 'plpgsql';

`;

// <--- only need this ran once
// CREATE TRIGGER update_vencura_users_updated_at
//     BEFORE UPDATE ON vencura.users
//     FOR EACH ROW
//     EXECUTE FUNCTION update_updated_at_column();

// CREATE TRIGGER update_vencura_wallets_updated_at
//     BEFORE UPDATE ON vencura.wallets
//     FOR EACH ROW
//     EXECUTE FUNCTION update_updated_at_column();

// CREATE TRIGGER update_vencura_transactions_updated_at
//     BEFORE UPDATE ON vencura.transactions
//     FOR EACH ROW
//     EXECUTE FUNCTION update_updated_at_column();
