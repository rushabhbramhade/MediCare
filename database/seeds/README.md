# Seeds

No seed data is committed.

Demo patients, hospitals, pharmacies, doctors and stock levels would be indistinguishable
from real data once loaded, and every screen that reads them would look functional while
being fabricated. Local development uses an empty database and the UI's honest empty
states.

When integration fixtures are genuinely needed, put them under a test-only command that
clearly labels the database as synthetic and never run them against a shared environment.
