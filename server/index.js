const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const articles = require('./routes/articles');
const spaces = require('./routes/spaces');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/spaces', spaces);
app.use('/api/articles', articles);

// Export app for testing. When run directly, start the server.
if (require.main === module) {
	const PORT = process.env.PORT || 4000;
	app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

module.exports = app;
