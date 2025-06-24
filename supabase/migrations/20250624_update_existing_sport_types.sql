-- SQL to update existing posts with correct sport_type
-- Set TRADITIONAL for posts with traditional sports
UPDATE posts
SET sport_type = 'TRADITIONAL'
WHERE sport && ARRAY['Football','Basketball','Tennis','Soccer','Baseball','Volleyball','Swimming','Running','Cycling','Golf','Hockey','Cricket','Rugby','Badminton','Table Tennis'];

-- Set ESPORT for posts with e-sports
UPDATE posts
SET sport_type = 'ESPORT'
WHERE sport && ARRAY['Valorant','BGMI','EAFC','NBA 2K','League of Legends','Call of Duty','Minecraft','Apex Legends','Other Online Games'];

-- Default any remaining NULL sport_types to TRADITIONAL
UPDATE posts
SET sport_type = 'TRADITIONAL'
WHERE sport_type IS NULL;
