/**
 * Created by tom on 16/11/3.
 * v0.0.1                                           2016.11.03
 */



var async = require('async');
var MYSQLConf = require('./mysql.json'),
    mysql = require('mysql'),
    MongoClient = require('mongodb').MongoClient;

var converter = require('csvtojson').Converter;
var new_c = new converter({});
var fs = require('fs');
var config = require('./config.json');
var Lastclose;
var config_mongo_option = config.mongo_option;
var g_mongodb;
var filename;

module.exports.singleCsv2Json2Mongo = mainfunc;

if (0) {
    if (process.argv.length > 2 && process.argv[2] == 'test') {
        test();
    } else if (process.argv.length > 2 && process.argv[2] == 'main') {
        filename = './csv/000001.SZ.csv';
        // console.log(filename);
        mainfunc(filename, function() {
            // console.log(new Date());
            closeMongo();
        });
    } else {
        // console.log("module.exports.singleCsv2Json2Mongo ok");
    }
}

/**
 * 一般用于测试启动该服务时的，一些必要服务是否正常？
 * 真正启动后，如果连不上，就报错。包括重连。这样就不用考虑服务的启动顺序了。
 **/
function test() {
    filename = './csv/000001.SZ.csv';
    // console.log("test() start .............");
    config_mongo_option = config.mongo_option_test;
    mainfunc(filename, function() {
        // console.log(new Date());
        // closeMongo();
        // process.exit(0);
        closeAll();
    });
}

function mainfunc(filename, callback) {
    // console.log("main filename =>", filename);
    connectAll(function(err) {
        if (err)
            console.log(err);
        else {
            procData(filename, function() {
                // console.log(filename, " end ------");
                closeMongo();
                callback(err, null);
            });
        }
    });
}

function get_info(item,filename){
    if (item.open != 0 && item.last != 0 && item.volume > 0 && item.high != 0 && item.low != 0) {
        var TrdDt = item.DATETIME.split(' ')[0].replace(/\-/g, ''),
            TrdTm = item.DATETIME.split(' ')[1].replace(/\:/g, ''),
            ID = filename.substring(filename.length - 13, filename.length - 4),
            MsgSeqNum = TrdDt + TrdTm + '000';
        var dateStr = (new Date()).getTime() + 8 * 60 * 60 * 1000;
        var _date = new Date(dateStr);
        TrdDt = parseInt(TrdDt);
        TrdTm = parseInt(TrdTm.substring(0, 4));

        var info = {
            "ID": ID,
            "PrevClsPx": item.preclose,
            "FirstPx": item.open,
            "LastPx": item.last,
            "HighPx": item.high,
            "LowPx": item.low,
            "MsgSeqNum": MsgSeqNum,
            "TrdVol": item.volume,
            "TrdAmt": item.amount,
            "TrdDt": TrdDt,
            "TrdTm": TrdTm,
            "UpdateAt": {"$date": _date.getTime()}
        };
        if (info.TrdTm <1200){
            return info;
        }else {
            return false
        }
    }
}
function print(rtn){
    var a=[];
    for(i in rtn){
        var maxPx=0,minPx=0,
            last=rtn[i][rtn[i].length-1],
            first=rtn[i][0],
            ID=last.ID;
        PrevClsPx=first.LastPx
        TrdVol=last.TrdVol,
            TrdAmt=last.TrdAmt,
            TrdDt=last.TrdDt,
            closePx=last.LastPx,
            MsgSeqNum=last.MsgSeqNum,
            UpdateAt=last.UpdateAt
        TrdTm=first.TrdTm,
            openPx=first.LastPx,
            item=rtn[i];
        if(i>0){
            var   PrevClsPx=rtn[i-1][rtn[i-1].length-1].LastPx;
        }
        item.map(function(i){
            minPx=item[0].LastPx;
            if(i.LastPx>maxPx){
                maxPx=i.LastPx
            }
            if(i.LastPx<minPx){
                minPx=i.LastPx;
            }
        })
        var insert_info={"ID":ID,"PrevClsPx" :PrevClsPx, "FirstPx" :openPx, "LastPx" :closePx, "HighPx" :maxPx,"LowPx" :minPx, "MsgSeqNum" :MsgSeqNum, "TrdVol" : TrdVol,  "TrdAmt" : TrdAmt, "TrdTm" : TrdTm,"TrdDt" : TrdDt, "UpdateAt" : UpdateAt }

        console.log(insert_info)
    }
}

function procData(filename, callback) {
    new_c = new converter({});
    fs.createReadStream(filename).pipe(new_c);

    new_c.on("end_parsed", function(data) {
        var rtn=[],
            one_min=[];
        for( i in data) {
            if (i < data.length - 3) {
                var item = data[i],
                    itemnext = data[parseInt(i) + 1],
                    item_next = data[parseInt(i) + 2],
                    minNow = item.DATETIME.split(' ')[1].replace(/\:/g, '').substring(2, 4),
                    minNext = itemnext.DATETIME.split(' ')[1].replace(/\:/g, '').substring(2, 4),
                    minNext2 = item_next.DATETIME.split(' ')[1].replace(/\:/g, '').substring(2, 4),
                    m_now = parseInt(minNow),
                    m_next = parseInt(minNext),
                    m_next2 = parseInt(minNext2);
                if (m_now === m_next) {
                    if(get_info(item, filename)){
                        one_min.push(get_info(item, filename));
                    }
                }
                if (m_now === m_next && m_next != m_next2) {
                    if(get_info(itemnext, filename)){
                        one_min.push(get_info(itemnext, filename))
                        rtn.push(one_min)
                    }
                    one_min=[]
                }
            }
        }
        print(rtn)
        callback(null,null)
    });
}
/*
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
        }], function(err) {
        callback(err);
    });
}

function closeAll() {
    // g_mysql.end();
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
}*/

