-- Adiciona colunas de destaque na tabela de rachas
ALTER TABLE rachas
ADD COLUMN IF NOT EXISTS top1_id UUID REFERENCES members(id),
ADD COLUMN IF NOT EXISTS top2_id UUID REFERENCES members(id),
ADD COLUMN IF NOT EXISTS top3_id UUID REFERENCES members(id),
ADD COLUMN IF NOT EXISTS sheriff_id UUID REFERENCES members(id);
