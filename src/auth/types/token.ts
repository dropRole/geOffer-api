type Token = {
  type: 'access' | 'refresh';
  value: string;
  expire: string;
};

export default Token;
