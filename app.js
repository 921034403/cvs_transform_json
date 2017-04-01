/**
 * Created by tom on 16/11/20.
 * v0.0.1                                           2016.11.20
 */
//"mongo_option":"mongodb://10.10.13.12/openQuote",
var async = require('async'),
    fs = require('fs');
var MYSQLConf = require('./mysql.json'),
    mysql = require('mysql'),
    MongoClient = require('mongodb').MongoClient;

var singleCsv2Json2Mongo = require("./singleCsv2Json2Mongo.js").singleCsv2Json2Mongo;
var dirPath = './csv/';
//dirPath = '/media/tom/988C1EA48C1E7CC6/fish/2016_1030_1101/';
// dirPath = '/media/tom/988C1EA48C1E7CC6/test/';

var config = require('./config.json');
var Lastclose;
var config_mongo_option = config.mongo_option;


if (process.argv.length > 2 && process.argv[2] == 'test') {
    test();
} else {
    // console.log(filename);
    main(dirPath, function(err, rtn) {
        // console.log(new Date());
        // console.log(rtn);
        // closeMongo();
    });
}

function test() {
    // dirPath = './csv/';
    console.log(dirPath);
    // filename = './000001.SZ.csv';
    config_mongo_option = config.mongo_option_test;
    // singleCsv2Json2Mongo(filename, function() {
    //     console.log(new Date());
    //     closeAll();
    // });
    main(dirPath, function() {
        // console.log(new Date());
        // closeAll();
    });
}

function main(dirPath, callback) {
    fs.readdir(dirPath, (err, data) => {
        if (err) throw err;
        // console.log(data);
        async.eachSeries(data, function(item, next) {
            // console.log(item);
            var filename = dirPath + item;
            // console.log("filename =>", filename);
            singleCsv2Json2Mongo(filename, function functionName() {

                next();
                // console.log(new Date());
            });
        }, function(err) {
            // console.log("async.eachSeries end");
            callback(err, "hehe, the end!");
            // closeMongo();
        });
    });

}


// connect mssql,mongo.
function connectAll(callback) {
    async.series([
        function(next) {
            MongoClient.connect(config_mongo_option, function(err, db) {
                if (!err) {
                    g_mongodb = db;
                    //console.log("connect mongodb ok");
                }
                next(err);
            });
        },
        function(next) {
            g_mysql = mysql.createConnection(MYSQLConf);
            g_mysql.connect(function(err) {
                //if (!err)
                //  console.log("connect mysql ok");
                next(err);
            });
        }
    ], function(err) {
        callback(err);
    });
}

function closeAll() {
    g_mysql.end();
    g_mongodb.close();
}



function connMongo(url, callback) {
    MongoClient.connect(url, function(err, db) {
        var func = arguments.callee;
        if (err) {
            setTimeout(function() {
                MongoClient.connect(url, func);
            }, 1000);
        } else
            callback(db);
    });
}

function closeMongo() {
    if (g_mongodb)
        g_mongodb.close();
}
