-- 0013_hospital_search_filters.sql
--
-- Directory attributes needed by hospital discovery filters. These are optional
-- provider-declared facts, not clinical capacity. Missing/NULL means unknown and
-- must never be rendered as a negative or a positive claim.

ALTER TABLE app.hospitals
  ADD COLUMN opening_hours text,
  ADD COLUMN is_open_24x7 boolean,
  ADD COLUMN has_ambulance boolean;

ALTER TABLE app.hospitals
  ADD CONSTRAINT hospitals_opening_hours_check
    CHECK (opening_hours IS NULL OR char_length(opening_hours) BETWEEN 1 AND 200);

COMMENT ON COLUMN app.hospitals.opening_hours IS
  'Provider-declared opening hours as free text. NULL means not reported.';
COMMENT ON COLUMN app.hospitals.is_open_24x7 IS
  'Provider-declared 24x7 opening. NULL means not reported; never assume true.';
COMMENT ON COLUMN app.hospitals.has_ambulance IS
  'Provider-declared ambulance service. NULL means not reported; never assume availability.';

-- Trigram indexes back the hospital/localities text search (name, address, city).
CREATE INDEX hospitals_name_trgm_idx
  ON app.hospitals USING gin (name gin_trgm_ops);
CREATE INDEX hospitals_address_trgm_idx
  ON app.hospitals USING gin (address_line gin_trgm_ops);
CREATE INDEX hospitals_city_trgm_idx
  ON app.hospitals USING gin (city gin_trgm_ops);

CREATE INDEX hospitals_open_24x7_idx
  ON app.hospitals (is_open_24x7) WHERE is_open_24x7 IS TRUE;
CREATE INDEX hospitals_ambulance_idx
  ON app.hospitals (has_ambulance) WHERE has_ambulance IS TRUE;
