-- Enable Supabase Realtime replication for admin console core tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE plants;
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE plant_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE hero_banner;
ALTER PUBLICATION supabase_realtime ADD TABLE carousel_slides;
ALTER PUBLICATION supabase_realtime ADD TABLE carousel_section_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
