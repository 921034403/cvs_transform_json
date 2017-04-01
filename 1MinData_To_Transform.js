/**
 * Created by sls on 2017/3/30.
 */

//"mongo_option":"mongodb://10.10.13.12/openQuote",
var async = require('async'),
    fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var dirPath = './csv/';
var config = require('./config.json');
var config_mongo_option = config.mongo_option;
var g_prid=15;

function Transform(result,g_prid,next){
    for(i in result){
        var TrdTm=result[i].TrdTm, len=TrdTm.toString().split("").length,min=parseInt(TrdTm.toString().substring(len-2,len));
        if(TrdTm>930 && min%g_prid===0){
            console.log(result[i]);
        }
    }
    next();
}


function main(dirPath,g_prid) {
    fs.readdir(dirPath, (err, data) => {
        if (err) throw err;
        async.eachSeries(data, function(item, next) {
            var ID=item.substring(0,9)
            MongoClient.connect(config_mongo_option,function(err,db){
                if(err){
                    console.log(err)
                }
                var col=db.collection("KLine_1Min")
                col.find({ID:ID,TrdTm:{$lt:1200}}).toArray(function(err,result){
                    if(err){
                        console.log(err)
                    }
                    if(result.length===0){
                        next()
                    }else {
                        Transform(result,g_prid,next)
                    }
                })
            })
        }, function(err) {
            if(err){
                console.log(err)
            }
        });
    });

}
main(dirPath,g_prid)








