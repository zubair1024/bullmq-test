import config from 'config';

export default {
  test: config.get('test'),
  env: config.get('env'),
};
