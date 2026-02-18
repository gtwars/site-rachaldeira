-- Create gallery_media table for storing photos and videos
CREATE TABLE IF NOT EXISTS gallery_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_gallery_media_type ON gallery_media(type);
CREATE INDEX idx_gallery_media_uploaded_at ON gallery_media(uploaded_at DESC);

-- Enable RLS
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery media"
    ON gallery_media FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own media
CREATE POLICY "Users can upload their own media"
    ON gallery_media FOR INSERT
    TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

-- Allow users to update/delete their own media
CREATE POLICY "Users can manage their own media"
    ON gallery_media FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own media"
    ON gallery_media FOR DELETE
    TO authenticated
    USING (uploaded_by = auth.uid());

-- Admins and directors can manage all gallery media
CREATE POLICY "Admins and directors can manage all gallery"
    ON gallery_media FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'director')
        )
    );
