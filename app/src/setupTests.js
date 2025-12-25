import '@testing-library/jest-dom/vitest';

// Mock window.alert for all tests
vi.spyOn(window, 'alert').mockImplementation(() => {});