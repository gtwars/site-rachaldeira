-- Financial System Schema

-- ENUMS
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_category AS ENUM ('monthly_fee', 'game_fee', 'field_rental', 'equipment', 'prize', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');

-- Financial Transactions
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL, -- Optional: link to a member
  status transaction_status NOT NULL DEFAULT 'completed',
  payment_method payment_method DEFAULT 'pix',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_member_id ON financial_transactions(member_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category);

-- Trigger for updated_at
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE financial_transactions IS 'Registros financeiros de beceitas e despesas';
