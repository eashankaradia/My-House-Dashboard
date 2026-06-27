-- Non-rectangular rooms: store an optional floor-plan outline as an array of
-- {x,y} points in cm. (Doors already live in rooms.doors jsonb from 0025.)

alter table public.rooms add column if not exists outline jsonb;
