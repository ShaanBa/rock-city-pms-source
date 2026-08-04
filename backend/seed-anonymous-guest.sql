INSERT INTO guests ("id", "FirstName", "LastName", "IsIdVerified", "IsDNR")
VALUES ('00000000-0000-0000-0000-000000000001', 'Anonymous', 'Walk-In', true, false)
ON CONFLICT ("id") DO NOTHING;
