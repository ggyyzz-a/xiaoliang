const express=require('express')
const router=require('./router/router')
const bodyParser=require('body-parser')
const session=require('express-session')

const app=express()

app.engine('html',require('express-art-template'))

app.use('/assets/',express.static('./assets/'))
app.use('/views/',express.static('./views/'))
app.use('/node_modules/',express.static('./node_modules/'))

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

app.use(session({
    secret:'essay',
    resave:false,
    saveUninitialized:true
}))

app.use(router)

app.listen(5000,'127.0.0.1',function () {
    console.log('running to @http://127.0.0.1:5000')
})