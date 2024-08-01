import dayjs from './dayjs';

describe('dayjs', () => {
  it('should return the current date when called without arguments', () => {
    const now = new Date();
    const dayjsDate = dayjs();

    expect(dayjsDate.year()).toEqual(now.getFullYear());
    expect(dayjsDate.month()).toEqual(now.getMonth());
    expect(dayjsDate.date()).toEqual(now.getDate());
  });
});
