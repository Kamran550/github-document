const express = require('express');
const { engine } = require("express-handlebars");
const app = express();
const Sequelize = require("sequelize")
const Op = Sequelize.Op
const { User, Company, user_company, document, user_document, sessions, Admin } = require('./models');
const company = require('./models/company');
const nodemailer = require('nodemailer');
const cookie = require('cookie');
const uuid = require('uuid');
const multer = require('multer');
const path = require('path');

// const PORT = process.env.PORT || 5000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        const { originalname } = file
        cb(null, originalname)
    }
});


// app.use((req, res, next) => {
//     if (!req.headers.cookie) {
//          res.redirect('/')
//     }
//      next()
// })

const upload = multer({ storage });



const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
        user: 'jaytan@inbox.ru',
        pass: 'pmMMKVUUxjKgPus2Um54'
    }
})
console.log('salam')
app.engine("handlebars", engine({
    defaultLayout: 'main',

    helpers: {
        ifeq: function (a, b, options) {
            if (a === b) {
                return options.fn(this);

            }
            else {
                return options.inverse(this);
            }
        },
        ifnoteq: function (a, b, options) {
            if (a !== b) {
                return options.fn(this);

            }
            return options.inverse(this);
        }
    }


}));

app.set('view engine', 'handlebars');

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use('/js', express.static('js'));

app.use('/uploads', express.static('uploads'))
app.get('/', async (req, res) => {

    Admin.create({
        name: "Admin",
        password: 'Admin001'
    })
    res.render('login')
});

app.get('/admin', async (req, res) => {
    res.render('admin')
});

app.post('/admin', async (req, res) => {
    const { name, password } = req.body


    try {
        const keyword = uuid.v4()
        const Adminlogin = await Admin.findOne({
            where: {
                name,
                password
            },
            raw: true
        })

        if (Adminlogin) {
            res.append('set-cookie', 'admin=' + true)
            res.redirect('/adduser')
        } else {
            res.render('admin', {
                errorText: "Daxil edilen melumatlar sefdir"
            })
        }

    } catch (err) {
        if (err) {
            console.log(err);
        }
    }
})

// app.use(async (req, res, next) => {
//     if (req.headers.cookie) {
//         var cook = cookie.parse(req.headers.cookie)
//     }

//     const session = await sessions.findOne({
//         where: {
//             keyword: cook.keyword
//         },
//         raw: true
//     })

//     const admin = JSON.parse(session.data)
//     console.log("sessionlarrrr:", admin);



// })


app.use((req, res, next) => {





    if (req.headers.cookie) {
        return next()
    }

    // if (!req.headers.cookie) {
    //     return res.redirect('/')
    // }

    next()
});

app.get('/adduser', (req, res) => {
    try {
        const cook = cookie.parse(req.headers.cookie)
        if (cook.admin) {
            res.render('administration');
        } else {
            res.render('adminError', {
                error: "Bu sehifeye yalniz admin daxil ola biler"
            })
        }
    } catch (err) {
        if (err) {
            res.render('adminError', {
                error: "Bu sehifeye yalniz admin daxil ola biler"
            })
        }
    }

})

app.post('/adduser', async (req, res) => {
    const { firstname, lastname, email, password, position, company } = req.body;

    try {

        var com = await Company.findOne({
            raw: true,
            where: {
                name: company
            }
        });
        if (!com) {

            await Company.create({
                name: company
            })

        }
        var us = await User.create({
            firstname,
            lastname,
            email,
            position,
            password
        });
        var userCookie = JSON.stringify(us.dataValues)

        console.log(JSON.parse(userCookie))


        const sendMaill = transporter.sendMail({
            subject: "Admin",
            to: email,
            from: 'jaytan@inbox.ru',
            replyTo: email,
            text: password,
        });

        const cc = await Company.findOne({
            raw: true,
            where: {
                name: company
            }
        })
        await user_company.create({
            UserId: us.dataValues.id,
            CompanyId: cc.id
        })


    } catch (err) {
        if (err) {
            return res.render('administration', {
                errortext: err.message,
                ...req.body
            })
        }

    }

    res.render('administration')
})

app.get('/company', (req, res) => {
    res.render('company')
})


app.get('/users/:page', async (req, res) => {

    try {
        const cook = cookie.parse(req.headers.cookie)
        if (cook.admin) {
            let pagination = [];
            const comp = await User.count();
            const result = await User.findAll({
                raw: true,
                limit: 5,
                offset: (req.params.page - 1) * 5,
                include: {
                    model: Company
                },
                raw: true,
                nest: true
            });
            const cnt = Math.ceil((comp) / 5);
            for (let i = 1; i <= cnt; i++) {

                if (i <= 2) {
                    pagination.push(i);
                } else if (!pagination.includes('...')) {
                    pagination.push('...')
                }

            };


            console.log(pagination);
            res.render('users', {
                result,
                pagination
            });
        } else {
            res.render('adminError', {
                error: "Bu sehifeye yalniz admin daxil ola biler"
            })
        }
    } catch (err) {
        if (err) {
            res.render('adminError', {
                error: "Bu sehifeye yalniz admin daxil ola biler"
            })
        }
    }
});


// Login
app.post('/', async (req, res) => {
    const { username, password, company } = req.body

    res.locals.username = username


    const keyword = uuid.v4()

    try {
        const login = await User.findOne({
            raw: true,
            where: { firstname: username, password },
            include: Company
        })

        console.log(login)
        const data = JSON.stringify(login)


        await sessions.create({
            keyword,
            data
        });



        if (login && login['Companies.name'] === company) {
            res.append('set-cookie', 'keyword=' + keyword)

            res.redirect('/addfile')
        } else {
            res.render('login', {
                errorText: 'Daxil edilen melumatlar sefdir'
            })
        }
    } catch (err) {
        // res.status(500).end()
        console.log(err)
    }
});



app.get('/addfile', async (req, res) => {

    try {
        const cook = cookie.parse(req.headers.cookie)
        if (cook.keyword) {
            const company = await Company.findAll({
                raw: true
            });
            res.render('addfile', {
                company
            });
        } else if (cook.admin) {
            res.render('adminError', {
                error: "Siz adminsiz.Bu document gondermek ucun sehifedir ve Istifadeciler ucun nezerde tutulub"
            })
        }
    } catch (err) {
        res.render('errorPage', {
            error: "Siz Login olmamisiniz"
        })
    }


})


app.get('/addfile/:sirket', async (req, res) => {
    const seccomp = req.params.sirket;
    var cook = cookie.parse(req.headers.cookie)

    const session = await sessions.findOne({
        where: {
            keyword: cook.keyword
        }
    })
    const info = JSON.parse(session.data);
    console.log('info:', info.id);
    const sirketler = await User.findAll({
        raw: true,
        where: {
            id: info.id
        },
        include: {
            model: Company
        },
        nest: true
    });
    console.log('sirketler:', sirketler[0].id);
    const userler = await Company.findAll({
        where: {
            name: seccomp
        },
        raw: true,
        include: {
            model: User,
            where: {
                id: {
                    [Op.ne]: sirketler[0].id
                }
            }
        },
        nest: true
    })

    console.log('isciler:', userler);

    res.json({
        userler
    });
});


app.post('/addfile', upload.single('avatar'), async (req, res) => {
    const { docName, employees, companies } = req.body
    var cook = cookie.parse(req.headers.cookie)
    const key = uuid.v4()




    try {

        const session = await sessions.findOne({
            where: {
                keyword: cook.keyword
            }
        })
        const info = JSON.parse(session.data);


        // console.log(info)
        const doc = await document.create({
            docName,
            sender: info.firstname,
            sendingCompany: info['Companies.name'],
            docPath: '/' + req.file.path
        });
        console.log('doc:', doc);
        const sirket = await Company.findAll({
            where: {
                name: companies,
            },
            include: {
                model: User,
                where: {
                    firstname: employees
                }
            },

            raw: true,
            nest: true
        });

        console.log('length:', sirket);
        console.log('sirketler:', sirket);
        if (sirket.length !== 1) {
            for (var send of sirket) {
                var sendUSer = send.Users.id
                const userDoc = await user_document.create({
                    documentId: doc.dataValues.id,
                    UserId: sendUSer
                })
            }
        } else if (sirket.length === 1) {
            const userDoc = await user_document.create({
                documentId: doc.dataValues.id,
                UserId: sirket[0].Users.id
            })

        }



        res.redirect('/addfile')
    } catch (err) {
        if (err) {
            console.log(err);
            res.render('addfile', {
                errorText: err.message
            })
        }
    }
});



app.get('/settings', async (req, res) => {

    try {
        const cook = cookie.parse(req.headers.cookie)
        if (cook.keyword || cook.admin) {
            res.render('settings')
        }
    } catch (err) {
        if (err) {
            res.render('errorPage', {
                error: "Siz Login Olmamisiz"
            })
        }
    }

});



app.post('/settings', async (req, res) => {

    try {
        if (cook.keyword) {
            const { oldPassword, newPassword } = req.body
            const key = uuid.v4()

            const cook = cookie.parse(req.headers.cookie)

            const session = await sessions.findOne({
                where: {
                    keyword: cook.keyword
                }
            })
            const info = JSON.parse(session.data);
            console.log(info)


            if (oldPassword === info.password) {
                const userler = await User.update({
                    password: newPassword
                },
                    {
                        where: {
                            id: info.id
                        }
                    }
                )
                const user = await User.findOne({
                    where: {
                        id: info.id
                    },
                    include: Company,
                    raw: true,
                    nest: true
                });

                const data = JSON.stringify(user)
                await sessions.update({
                    keyword: key,
                    data
                }, {
                    where: {
                        keyword: cook.keyword
                    }
                });


                res.clearCookie('keyword')
                res.append('set-cookie', 'keyword=' + key)

            } else {
                res.render('settings', {
                    errorText: 'Kohne parolunuz yanlisdir,Zehmet olmasa Parolunuzu deqiqlesdirib yeniden cehd edin.'
                })
            }
            res.render('settings')
        } else {
            res.end()
        }

    } catch (err) {
        if (err) {
            res.render('errorPage', {
                error: "Siz login olmamisiniz"
            })
        }
    }
});




app.get('/home', async (req, res) => {
    res.render('home')
});


app.get('/home/pending', async (req, res) => {
    const pend = req.params;
    const cook = cookie.parse(req.headers.cookie)
    var arr1 = []


    const session = await sessions.findOne({
        where: {
            keyword: cook.keyword
        }
    })
    const info = JSON.parse(session.data);


    const userDoc = await user_document.findAll({

        where: {
            pending: true,
            UserId: info.id
        },
        raw: true,
        nest: true,

    });

    // console.log(userDoc)
    for (var arr of userDoc) {
        // console.log(arr.documentId)
        arr1.push(arr.documentId)
    }

    // console.log(arr1)


    const doc = await document.findAll({
        where: {
            id: {
                [Op.in]: arr1
            }
        },
    })


    console.log(doc)

    res.json({
        doc
    })
});


app.get('/inbox', async (req, res) => {
    try {
        const cook = cookie.parse(req.headers.cookie)
        var arr1 = []

        if (cook.keyword) {



            const session = await sessions.findOne({
                where: {
                    keyword: cook.keyword
                }
            })
            const info = JSON.parse(session.data);
            const userDoc = await user_document.findAll({

                where: {
                    pending: true,
                    UserId: info.id
                },
                raw: true,
                nest: true,

            });


            for (var arr of userDoc) {
                // console.log(arr.documentId)
                arr1.push(arr.documentId)
            }

            // console.log(arr1)


            const doc = await document.findAll({
                where: {
                    id: {
                        [Op.in]: arr1
                    }
                },
                raw: true
            });
            console.log(doc)

            res.render('inbox', {
                doc,
                message: 'Silmek isteyirsiz?'
            })
        } else if (cook.admin) {
            res.render('errorlar', {
                error: "Siz Adminsiz."
            })
        }

    } catch (err) {
        if (err) {
            res.render('errorPage', {
                error: "Siz Login olmamisiz"
            })
        }
    }
});


app.get('/accept/:id', async (req, res) => {
    const id = req.params.id

    const cook = cookie.parse(req.headers.cookie)
    const session = await sessions.findOne({
        where: {
            keyword: cook.keyword
        }
    })
    const info = JSON.parse(session.data);

    const acp = await user_document.update({
        accepted: true,
        pending: false
    },
        {
            where: {
                UserId: info.id,
                documentId: id
            }
        })
    console.log(acp)

    res.json({
        acp
    })
});


app.get('/reject/:id', async (req, res) => {
    const id = req.params.id
    const cook = cookie.parse(req.headers.cookie)
    const session = await sessions.findOne({
        where: {
            keyword: cook.keyword
        }
    })
    const info = JSON.parse(session.data);

    const rjc = await user_document.update({
        rejected: true,
        pending: false
    }, {
        where: {
            UserId: info.id,
            documentId: id
        }
    });
    res.json({
        rjc
    })

});



app.get('/accepted', async (req, res) => {
    try {
        const cook = cookie.parse(req.headers.cookie)

        if (cook.keyword) {
            var arr1 = []


            const session = await sessions.findOne({
                where: {
                    keyword: cook.keyword
                }
            })
            const info = JSON.parse(session.data);
            const userDoc = await user_document.findAll({

                where: {
                    accepted: true,
                    UserId: info.id
                },
                raw: true,
                nest: true,

            });


            for (var arr of userDoc) {
                // console.log(arr.documentId)
                arr1.push(arr.documentId)
            }

            // console.log(arr1)


            const doc = await document.findAll({
                where: {
                    id: {
                        [Op.in]: arr1
                    }
                },
                raw: true
            });
            console.log(doc)

            res.render('accepted', {
                doc,

            })
        } else if (cook.admin) {
            res.render('errorlar', {
                error: "Siz Adminsiz."
            })
        }
    } catch (err) {
        if (err) {
            res.render('errorPage', {
                error: "Siz login olmamisiz"
            })
        }
    }
});

app.get('/rejected', async (req, res) => {
    try {
        const cook = cookie.parse(req.headers.cookie)
        if (cook.keyword) {
            var arr1 = []

            const session = await sessions.findOne({
                where: {
                    keyword: cook.keyword
                }
            })
            const info = JSON.parse(session.data);
            const userDoc = await user_document.findAll({

                where: {
                    rejected: true,
                    UserId: info.id
                },
                raw: true,
                nest: true,

            });


            for (var arr of userDoc) {
                // console.log(arr.documentId)
                arr1.push(arr.documentId)
            }

            // console.log(arr1)


            const doc = await document.findAll({
                where: {
                    id: {
                        [Op.in]: arr1
                    }
                },
                raw: true
            });
            console.log(doc)

            res.render('rejected', {
                doc,
            })
        } else if (cook.admin) {
            res.render('errorlar', {
                error: "Siz Adminsiz."
            })
        }

    } catch (err) {
        if (err) {

            res.render('errorPage', {
                error: "Siz login olmamisiz"
            })
        }
    }
});


app.get('/exit', async (req, res) => {

    res.clearCookie('keyword')
    res.clearCookie('admin')
    res.redirect('/')
})

app.listen(5001, () => {
    console.log("server dinleyir");
})