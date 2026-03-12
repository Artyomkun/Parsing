export default {
  plugins: {
    autoprefixer: {}
  }
};
<<<<<<< HEAD

module.exports = {
  plugins: [
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')] : [])
  ]
};
=======
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
