const express=require('express')
const mysql=require('mysql')
const formidable=require('formidable')
const fs=require('fs')
const nodemailer = require('nodemailer')
const mammoth = require("mammoth");

//连接数据库
const pool=mysql.createPool({
    connectionLimit:10,//可连接的最大数，默认为10，一般设置为你的用户的五分之一
    host:'127.0.0.1',
    user:'root',
    password:'123456',
    database:'xiaoliang'
})
const router=express.Router()


//用户登录请求
router.post('/yhlogin',function (req,res) {
    var yonghuming=req.body.yonghuming
    var mima=req.body.mima
    pool.getConnection(function (err,connection){
        if (err){
            console.log("连接失败")
            res.send(err.message)
        } else {
            var sql = 'select * from yonghu_logo where yonghuming=?'
            connection.query(sql,[yonghuming],function (err,result) {
                connection.release()
                if (err){
                    return res.send(err.message)
                }
                if (result.length== 0) {
                    return  res.status(200).json({
                        err_code:1
                    })
                } else if (result[0].mima != mima) {
                    return  res.status(200).json({
                        err_code:2
                    })
                } else {
                    req.session.sid="yhdl";
                    user = { yhid: result[0].yhid, yonghuming: result[0].yonghuming, mima: result[0].mima, nichen: result[0].nichen }
                    req.session.user=user
                    // console.log(result)
                    res.status(200).json({
                        err_code:0,
                        // touxiang:result[0].admin_headportrait
                    })
                }
            })
        }
    })
})
//用户注册请求
router.post('/yhregist',function (req,res) {
    var nichen=req.body.nichen
    var yonghuming=req.body.yonghuming
    var mima=req.body.mima

    pool.getConnection(function (err,connection) {
        if (err) {
            console.log("连接失败")
            res.send(err.message)
        }else {
            var sql='SELECT * FROM yonghu_logo WHERE nichen=? or yonghuming=?'
            connection.query(sql,[nichen,yonghuming],function (err,result) {
                if (err){
                    return res.status(500).send(err)
                }
                for (var i=0;i<result.length;i++){
                    if (result[i].nichen==nichen) {
                        return  res.status(200).json({
                            err_code:1
                        })
                    }else if (result[i].yonghuming==yonghuming){
                        return res.status(200).json({
                            err_code:2
                        })
                    }
                }
                if (result.length==0) {
                    var sql2='insert into yonghu_logo(yonghuming,mima,nichen) values(?,?,?)'
                    connection.query(sql2,[yonghuming,mima,nichen],function (err,result) {
                        connection.release()
                        if (err){
                            return res.status(500).send(err)
                        }else {
                            // user={email:email,nickname:nickname}
                            // req.session.user=user
                            res.status(200).json({
                                err_code:0
                            })
                        }
                    })
                }
            })
        }
    })
})
//用户退出登录
router.get('/yhlogout',function (req,res) {
    req.session.destroy(function(err) {
        res.redirect('/');
    })
})


//admin登录请求
router.post('/adminlogin',function (req,res) {
    var damin=req.body.damin
    var psw=req.body.psw
    pool.getConnection(function (err,connection){
        if (err){
            console.log("连接失败")
            res.send(err.message)
        } else {
            var sql = 'select * from damin_logo where damin=?'
            connection.query(sql,[damin],function (err,result) {
                connection.release()
                if (err){
                    return res.send(err.message)
                }
                if (result.length== 0) {
                    return  res.status(200).json({
                        err_code:1
                    })
                } else if (result[0].psw != psw) {
                    return  res.status(200).json({
                        err_code:2
                    })
                } else {
                    req.session.sid="admin";
                    user = { damin: result[0].damin, psw: result[0].psw ,name: result[0].name }
                    req.session.user=user
                    // console.log(result)
                    res.status(200).json({
                        err_code:0,
                        // touxiang:result[0].admin_headportrait
                    })
                }
            })
        }
    })
})
//admin跳转
router.get('/admin',function (req, res) {
    if (req.session.sid=='admin'){
        var damin=req.session.user.damin
        pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from damin_logo where damin=?'
                connection.query(sql, [damin], function (err, result) {
                    connection.release()
                    if (err) {
                        return res.send(err.message)
                    }

                    res.render('admin.html', {
                        user: req.session.user,
                        name:result[0].name
                    })
                })
            }
        })
    }else {
        return res.send("<script>alert('请先登录！');window.location.href='/adminlog'</script>")
    }
})
//admin退出登录
router.get('/adminlogout',function (req,res) {
    req.session.destroy(function(err) {
        // res.redirect('/');
        return res.send("<script>alert('退出后台！');window.location.href='/'</script>")
    })
})


router.get('/',function (req, res) {
    if (req.session.sid=='yhdl'){
        var yonghuming=req.session.user.yonghuming
        pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from yonghu_logo where yonghuming=?'
                connection.query(sql, [yonghuming], function (err, result) {
                    var sql1 = 'select * from essay_table'
                    connection.query(sql1, function (err, result1) {
                        connection.release()
                        if (err) {
                            return res.send(err.message)
                        }
                        res.render('index.html', {
                        user: req.session.user,
                        // touxiang:result[0].admin_headportrait,
                        name:result[0].nichen,
                        essay:result1
                    })
                    })
                })
            }
        })
    }else {
        pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from essay_table'
                connection.query(sql, function (err, result) {
                    connection.release()
                    if (err) {
                        return res.send(err.message)
                    }
                    res.render('index.html', {
                        essay:result
                    })
                })
            }
        })

    }
})


router.get('/author',function (req, res) {
    if (req.session.sid=='yhdl'){
        var yonghuming=req.session.user.yonghuming
        pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from yonghu_logo where yonghuming=?'
                connection.query(sql, [yonghuming], function (err, result) {
                    connection.release()
                    if (err) {
                        return res.send(err.message)
                    }
                    res.render('index.html', {
                        user: req.session.user,
                        // touxiang:result[0].admin_headportrait,
                        name:result[0].nichen
                    })
                })
            }
        })
    }else {
        res.render('author.html')
    }
})


router.get('/adminlog',function (req,res) {
    res.render('adminlog.html')
})


router.get('/tool',function (req,res) {
    pool.getConnection(function (err,connection){
        if (err){
            console.log("连接失败")
            res.send(err.message)
        } else {
            var sql='select * from label_table where fenlei = ?'
            var a1='解析下载'
            var a2='有趣好玩'
            var a3='影视资源'
            var a4='生成工具'
            connection.query(sql,[a1],function (err,result) {
                if (err){
                    return res.send(err.message)
                }
                connection.query(sql,[a2],function (err,result1) {
                    if (err){
                        return res.send(err.message)
                    }
                    connection.query(sql,[a3],function (err,result2) {
                        if (err){
                            return res.send(err.message)
                        }
                        connection.query(sql,[a4],function (err,result3) {
                            connection.release()
                            if (err){
                                return res.send(err.message)
                            }
                            res.render('tool.html',{
                                table:result,
                                table1:result1,
                                table2:result2,
                                table3:result3,
                                fenlei:result[0].fenlei,
                                fenlei1:result1[0].fenlei,
                                fenlei2:result2[0].fenlei,
                                fenlei3:result3[0].fenlei,
                            })
                        })
                    })
                })
            })
        }
    })
})


router.get('/viewer',function (req,res) {
    res.render('../assets/js/pdfjs/web/viewer.html')
})

router.get('/search',function (req,res) {
    res.render('search.html')
})
//tool页面搜索
router.post('/search',function (req,res) {
    var searchText=req.body.searchText
    pool.getConnection(function (err,connection){
        if (err){
            console.log("连接失败")
            res.send(err.message)
        } else if (searchText=="") {
            res.redirect('/tool')
        }else{
            var sql='select * from label_table where name like ? '
            connection.query(sql,['%'+searchText+'%'],function (err,result) {
                connection.release()
                if (err){
                    return res.send(err.message)
                }
                //console.log(result)

                res.render('search.html',{
                    search:result
                })
            })
        }
    })
})


router.get('/details',function (req,res) {
    var wid=req.query.wid
    pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from essay_table where wid=?'
                connection.query(sql, [wid], function (err, result1) {
                    connection.release()
                    if (err) {
                        return res.send(err.message)
                    }
                    res.render('details.html', {
                        details:result1[0].content
                    })
                })
            }
        })
})


router.get('/essay',function (req,res) {
    if (req.session.sid=='admin'){
        var damin=req.session.user.damin
        pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from damin_logo where damin=?'
                connection.query(sql, [damin], function (err, result1) {
                    if (err) {
                        return res.send(err.message)
                    }
                    var sql1='select * from essay_table'
                    connection.query(sql1,function (err,result) {
                        connection.release()
                        if (err){
                            return res.send(err.message)
                        }
                        //console.log(result)
                        res.render('essay.html',{
                            essay:result,
                            user: req.session.user,
                            name:result1[0].name
                        })
                    })
                })
            }
        })
    }else {
        return res.send("<script>alert('请先登录！');window.location.href='/adminlog'</script>")
    }

})
//添加文章
router.post('/add_essay',function (req,res) {
    var form = new formidable.IncomingForm();
    var img=form.uploadDir="./assets/images/essay"
    var text=form.uploadDir="./assets/js/pdfjs/web"
    form.keepExtensions = true
    form.parse(req, function(err, fields, files) {
        if (err) {
            return res.end(err.message)
        }
        var newPath1 = img + '/' + files.fm_img.name

        var newPath3 = text + '/' + files.content.name
        fs.rename(files.fm_img.path, newPath1,function (err) {
            fs.rename(files.content.path, newPath3,function (err){
                if (!err){
                    var title=fields.title
                    var content=files.content.name
                    var author=fields.author
                        var time=fields.time
                        var jianjie = fields.jianjie
                        var fm_img = files.fm_img.name
                        pool.getConnection(function (err,connection) {
                            if (err) {
                                console.log("连接失败");
                                res.send(err.message)
                            }else{
                                //console.log(title,content,author,time,wz_img,fm_img);
                                var sql2='INSERT INTO essay_table VALUES(null,?,?,?,?,?,?)'
                                connection.query(sql2,[title,content,author,time,jianjie,fm_img],function (err) {
                                    connection.release()
                                    if (err){
                                        res.send('添加失败'+err.message)
                                    }
                                    res.send("<script>alert('添加成功！');window.location.href='/essay'</script>")
                                })
                            }
                        })
                    }
            })
        })
    })
})
//删除文章
router.get('/delessay',function (req,res) {
    var wid=req.query.wid
    var url="./assets/images/essay"
    var url1="./assets/js/pdfjs/web"
    pool.getConnection(function (err,connection) {
        if (err) {
            console.log("连接失败")
            res.send(err.message)
        } else {
            var sql = 'select * from essay_table where wid=?'
            connection.query(sql,[wid],function (err,result) {
                if (err){
                    return res.send(err.message)
                }

                var delimg_url1 = url + '/' + result[0].fm_img
                var deldocx = url1 + '/' + result[0].content
                    fs.unlink(delimg_url1,function (err) {
                        fs.unlink(deldocx,function (err) {
                            var sql = 'DELETE FROM essay_table WHERE wid=?'
                            connection.query(sql, [wid], function (err, result) {
                                connection.release()
                                if (err) {
                                    return res.send(err.message)
                                }
                                res.redirect('/essay')
                            })
                        })

                    })

            })

        }
    })
})
//修改文章信息
router.post('/revise_essay',function (req,res) {
    var form = new formidable.IncomingForm();
    var fm=form.uploadDir="./assets/images/essay"
    var content1=form.uploadDir="./assets/js/pdfjs/web"
    form.keepExtensions = true
    form.parse(req,function(err, fields, files) {
        if (err) {
            return res.end(err.message)
        }
        var newPath1 = content1 + '/' + files.content.name
        var newPath2 = fm + '/' + files.fm_img.name
        fs.rename(files.content.path, newPath1,function (err) {
            fs.rename(files.fm_img.path, newPath2,function (err) {
            if (!err){
                var wid=fields.wid
                var title=fields.title
                var content=files.content.name
                var author=fields.author
                var time=fields.time
                var jianjie=fields.jianjie
                var fm_img = files.fm_img.name
                var yuan_content = fields.yuan_content
                var yuan_fm_img = fields.yuan_fm_img
                pool.getConnection(function (err,connection) {
                    if (err) {
                        console.log("连接失败");
                        res.send(err.message)
                    }else{
                        var delcontent_url = content1 + '/' +yuan_content
                        var delimg_url1 = fm + '/' +yuan_fm_img
                        fs.unlink(delcontent_url,function (err) {
                            fs.unlink(delimg_url1,function (err) {
                                var sql='update essay_table set title=?,content=?,author=?,time=?,jianjie=?,fm_img=? where wid=?'
                                connection.query(sql,[title,content,author,time,jianjie,fm_img,wid],function (err,result) {
                                    connection.release()
                                    if (err){
                                        res.send('添加失败'+err.message)
                                    }
                                    res.send("<script>alert('修改成功！');window.location.href='/essay'</script>")
                                })
                            })
                        })
                    }
                })
            }
            })

        })
    })
})



router.get('/table',function (req,res) {
    if (req.session.sid=='admin'){
        var damin=req.session.user.damin
        pool.getConnection(function (err,connection){
            if (err){
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql1 = 'select * from damin_logo where damin=?'
                connection.query(sql1, [damin], function (err, result1) {
                    if (err) {
                        return res.send(err.message)
                    }
                    var sql='select * from label_table'
                    connection.query(sql,function (err,result) {
                        connection.release()
                        if (err){
                            return res.send(err.message)
                        }
                        //console.log(result)
                        res.render('table.html',{
                            table:result,
                            user: req.session.user,
                            name:result1[0].name
                        })
                    })
                })
            }
        })
    }else {
        return res.send("<script>alert('请先登录！');window.location.href='/adminlog'</script>")
    }


})
//添加标签
router.post('/addtable',function (req,res) {
    var form = new formidable.IncomingForm();
    form.uploadDir="./assets/images/bq_img"
    form.keepExtensions = true
    form.parse(req, function(err, fields, files) {
        if (err) {
            return res.end(err.message)
        }
        var newPath1 = form.uploadDir + '/' + files.img_url.name
        fs.rename(files.img_url.path, newPath1,function (err) {
            if (!err){
                var name=fields.name
                var jianjie=fields.jianjie
                var to_url=fields.to_url
                var img_url = files.img_url.name
                var fenlei=fields.fenlei
                pool.getConnection(function (err,connection) {
                    if (err) {
                        console.log("连接失败");
                        res.send(err.message)
                    }else{
                        var sql='select * from label_table where name=?'
                        connection.query(sql,[name],function (err,result) {
                            if (result.length!=0){
                                return res.send("<script>alert('标签已存在！');window.location.href='/table'</script>")
                            }else if (result.length==0) {
                                var sql2='INSERT INTO label_table VALUES(null,?,?,?,?,?)'
                                connection.query(sql2,[name,jianjie,img_url,to_url,fenlei],function (err,result) {
                                    connection.release()
                                    if (err){
                                        res.send('添加失败'+err.message)
                                    }
                                  res.send("<script>alert('添加成功！');window.location.href='/table'</script>")
                                })
                            }
                        })
                    }
                })
            }


        })
    })
})
//删除表格信息
router.get('/deltable',function (req,res) {
    var bid=req.query.bid
    var url="./assets/images/bq_img"
    pool.getConnection(function (err,connection) {
        if (err) {
            console.log("连接失败")
            res.send(err.message)
        } else {
            var sql = 'select * from label_table where bid=?'
            connection.query(sql,[bid],function (err,result) {
                if (err){
                    return res.send(err.message)
                }
                var delimg_url = url + '/' + result[0].img_url
                fs.unlink(delimg_url,function (err) {
                    var sql='DELETE FROM label_table WHERE bid=?'
                    connection.query(sql,[bid],function (err,result) {
                        connection.release()
                        if (err){
                            return res.send(err.message)
                        }
                        res.redirect('/table')
                    })
                })
            })

        }
    })
})
//修改表格信息
router.post('/revise',function (req,res) {
    var form = new formidable.IncomingForm();
    form.uploadDir="./assets/images/bq_img"
    form.keepExtensions = true
    form.parse(req, function(err, fields, files) {
        if (err) {
            return res.end(err.message)
        }
        var newPath1 = form.uploadDir + '/' + files.img_url.name
        fs.rename(files.img_url.path, newPath1,function (err) {
            if (!err){
                var bid=fields.bid
                var name=fields.name
                var jianjie=fields.jianjie
                var to_url=fields.to_url
                var img_url = files.img_url.name
                var yuan_img_url = fields.yuan_img_url
                var fenlei=fields.fenlei
                pool.getConnection(function (err,connection) {
                    if (err) {
                        console.log("连接失败");
                        res.send(err.message)
                    }else{
                        var delimg_url = form.uploadDir + '/' +yuan_img_url
                        fs.unlink(delimg_url,function (err) {
                        var sql='update label_table set name=?,jianjie=?,img_url=?,to_url=?,fenlei=? where bid=?'
                        connection.query(sql,[name,jianjie,img_url,to_url,fenlei,bid],function (err,result) {
                            connection.release()
                            if (err){
                                res.send('添加失败'+err.message)
                            }
                            res.send("<script>alert('修改成功！');window.location.href='/table'</script>")
                        })
                        })
                    }
                })
            }


        })
    })
})


router.get('/users',function (req,res) {
    if (req.session.sid=='admin'){
        var damin=req.session.user.damin
        pool.getConnection(function (err,connection) {
            if (err) {
                console.log("连接失败")
                res.send(err.message)
            } else {
                var sql = 'select * from damin_logo where damin=?'
                connection.query(sql, [damin], function (err, result1) {
                    if (err) {
                        return res.send(err.message)
                    }
                    var sql1='select * from yonghu_logo'
                    connection.query(sql1,function (err,result) {
                        connection.release()
                        if (err){
                            return res.send(err.message)
                        }
                        //console.log(result)
                        res.render('users.html',{
                            users:result,
                            user: req.session.user,
                            name:result1[0].name
                        })
                    })
                })
            }
        })
    }else {
        return res.send("<script>alert('请先登录！');window.location.href='/adminlog'</script>")
    }

})
//删除用户信息
router.get('/delusers',function (req,res) {
    var aid=req.query.aid
    pool.getConnection(function (err,connection) {
        if (err) {
            console.log("连接失败")
            res.send(err.message)
        } else {
            console.log(aid)
            var sql = 'DELETE FROM yonghu_logo WHERE aid=?'
            connection.query(sql,[aid],function (err,result) {
                connection.release()
                if (err){
                    return res.send(err.message)
                }
                res.redirect('/users')
            })

        }
    })
})
//后台修改用户信息
router.post('/revise_users',function (req,res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        if (err) {
            return res.end(err.message)
        }
    var aid=fields.aid
    var yonghuming=fields.yonghuming
    var mima=fields.mima
    var nichen=fields.nichen
    pool.getConnection(function (err,connection) {
        if (err) {
            console.log("连接失败");
            res.send(err.message)
        }else{
            var sql='update yonghu_logo set yonghuming=?,mima=?,nichen=? where aid=?'
            connection.query(sql,[yonghuming,mima,nichen,aid],function (err,result) {
                connection.release()
                if (err){
                    res.send('添加失败'+err.message)
                }
                res.send("<script>alert('修改成功！');window.location.href='/users'</script>")
            })
        }
    })
    })
})


module.exports=router