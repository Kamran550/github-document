// const express = require('express');
// const { engine } = require("express-handlebars");
// const app = express();
// const multer = require('multer')
// const path = require('path')

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'Images')
//     },
//     filename: (req, file, cb) => {
//         console.log(file)
//         cb(null, Date.now() + path.extname(file.originalname))
//     }
// })

// const upload = multer({ storage: storage })

// app.engine('handlebars', engine({
//     defaultLayout: 'main'
// }));

// app.set('view engine', 'handlebars');

// app.use(express.urlencoded({
//     extended: true
// }));
// app.use(express.json());

// app.get('/upload', (req, res) => {
//     res.render('fayl')
// });
// app.post('/upload', upload.single("image"), (req, res) => {
//     res.send('Image yuklend...')
// })


// app.listen(3000)