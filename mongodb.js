const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://admin:1234@cluster0.9jx0l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected'))
    .catch(err => console.log(err));

const logInSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
});

const LogInCollection = mongoose.model('LogInCollection', logInSchema);

module.exports = LogInCollection;
