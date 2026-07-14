// Keep successful Jest output focused on assertions instead of expected
// database and scheduler progress logs. Tests that need to verify logging can
// still override this spy locally with their own jest.spyOn/mockImplementation.
jest.spyOn(console, 'log').mockImplementation(() => undefined);
