export const Asset = {
  fromModule: jest.fn(() => ({
    downloadAsync: jest.fn(),
    uri: 'test-uri'
  }))
};
