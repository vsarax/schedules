const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
                        user: 'postgres',
                        host: 'localhost',
                        database: 'mrCoffee',
                        password: 'haslo',
                        port: 5432,
                    })

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', (req, res) => {
    res.render('base', { 
                        title: 'The schedule website', 
                        message: 'The schedule website', 
                        text: 'Welcome to our schedule website'
                    })
})

app.get('/users', async (req, res) => {
    try {
        const {rows: users} = await pool.query('SELECT * FROM users');
        res.render('users', {
                             title: 'Users',
                             message: 'The list of users',
                             text: "",
                             users
                        })
    } catch (err) {
                    console.error('Error ', err.message);
                    res.status(500).send('Server error');
                    return;
    }
})

app.get('/schedules', async (req, res) => {
    try {
        const { rows: schedules } = await pool.query('SELECT * FROM schedules');
        res.render('schedules', { 
                                 title: 'Schedules', 
                                 message: 'The list of schedules', 
                                 text: '',
                                 schedules
                            })
    } catch (err) {
                   console.error('Error ', err.message);
                   res.status(500).send('Server error');
                   return;
    }
})

app.get('/users/:user_id(\\d+)', async (req, res) => {
    const user_id = req.params['user_id'];

    try {
        const { rows: user } = await pool.query(`SELECT * FROM users WHERE id = ${user_id}`);
        res.render('user_id', { 
                                title:   `User id ${user_id}`,
                                message: `User id ${user_id}`,
                                text: "",             
                                "firstname":   user[0].firstname,
                                "lastname":    user[0].lastname,
                                "email":       user[0].email,
                                "password":    user[0].password
                            })
    } catch (err) {
                   console.error('Error ', err.message);
                   res.status(500).send('Server error');
                   return;
    }
})

app.get('/users/:user_id/schedules', async (req, res) => {
	const user_id = parseInt(req.params['user_id'], 10);

    try {
        const { rows: schedules } = await pool.query('SELECT * FROM schedules');
        const results = schedules.filter(schedule => schedule.user_id == user_id);
    
        if(results.length === 0){
            res.status(404).json(`There is no schedule for user id: ${user_id}`);
            return;
        }


        res.render('schedules_user_id', { 
                                        title:   `User id ${user_id}`,
                                        message: `User id ${user_id}`,
                                        text:    "",     
                                        results: results
                                    })
    } catch (err) {
                   console.error('Error ', err.message);
                   res.status(500).send('Server error');
                   return;
    }

})

app.get('/users/new', async (req, res) => {
    res.render('new_user', { 
                            title:   'Add a new user',
                            message: `Add a new user`,
                            text: ''
                          })

})

app.post('/users/new', async (req, res) => {
    let { firstname, lastname, email, password } = req.body;
    const salt = 'uniqueSaltValue';
    const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
    password = hash;
    const query = 'INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4)';
    const values = [firstname, lastname, email, password];

    await pool.query(query, values, (err, result) => {
        if (err) {
                  console.error('Error: ', err.message);
                  res.status(500).send('Server error');
        } else {
                console.log('The new user has been added to the database');
                res.redirect('/users');
        }
    })
})

app.get('/schedules/new', async (req, res) => {
    try {
        const {rows: users} = await pool.query('SELECT * FROM users');
        res.render('new_schedule', { 
                                    title:   'Add a new schedule',
                                    message: `Add a new schedule`,
                                    text: '',
                                    users
                                })
    } catch (err) {
                   console.error('Error ', err.message);
                   res.status(500).send('Server error');
                   return;
    }
})

app.post('/schedules/new', async (req, res) => {
    const { user_id, day, start_at, end_at } = req.body;
    const query = 'INSERT INTO schedules (user_id, day, start_at, end_at) VALUES ($1, $2, $3, $4)';
    const values = [user_id, day, start_at, end_at];

    await pool.query(query, values, (err, result) => {
        if (err) {
                  console.error('Error: ', err.message);
                  res.status(500).send('Server error');
        } else {
                console.log('The new schedule has been added to the database');
                res.redirect('/schedules');
        }
    })
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
})
