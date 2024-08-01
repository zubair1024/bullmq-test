import dayjs from 'dayjs';

dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));

export default dayjs;
