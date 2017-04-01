修改数据库记录：
   操作人：逍遥子
   操作数据库：10.10.13.12/openQuote   KLine_1Min  KLine_5Min  KLine_15Min
               TrdDt:20170323  TrdTm:930-1200   ID:SZ SH
               TrdDt:20170330  TrdTm:1016-1200  ID:SH


文件功能说明：
    【csv文件夹下的文件以股票代码命名】
    app.js+singleCsv2Json2Mongo.js:读取csv文件夹下的每个csv文件，将每分钟的内的多行数据做统计计算后转化为一条可插入mongodb的对象，
    打印输出为每分钟统计结果。
    1MinData_To_Transform.js:同步读取csv文件夹的文件名，将文件名作为股票代码分别查询相关数据并打印可插入mongodb的对象。

    node app.js>KLine_1Min.dat  获取KLine_1Min的数据,执行mongoimport 导入KLine_1Min数据库
    node 1MinData_To_Transform.js  将KLine_1Min的数据转化为KLine_5Min或KLine_15Min，具体使用请查看相应文件代码

    打印关键数据结构说明：
        PrevClsPx:上一分钟的收盘价即LastPx;
        FirstPx  :当前分钟内的开盘价;
        LastPx   :当前分钟内的收盘价;
        HighPx   :当前分钟内的最高价;
        LowPx    :当前分钟内的收低价;

示例：
   【注：9:35数据指9:35:00到9:36:00，其中9:36:00不包含在内，其它的同理。】
   如下是9:35的统计数据:
    {ID:'000001.SZ',PrevClsPx:9.18,FirstPx:9.18,LastPx:9.19,HighPx:9.2,LowPx:9.18,TrdVol:4010506,TrdAmt:36787733,TrdTm:935}
   说明:其中PrevClsPx即为9:34内最后一次的LastPx，第一条数据的PrevClsPx则是当前分钟的FirstPx。


数据流：
   Csv文件夹            app.js                Terminal
     _________       __________            ______________________
    | csv file|     |          |          |                      |
    |....     |---> |  handler |--------->|{ID:"000001.SZ",.....}|
    | ________|     |__________|          |______________________|


                            
  Csv文件夹            1MinData_To_Transform.js               mongodb
      _________       _________________________           _______________________
     | csv file|     |                         |          |                      |
     |....     |---> |get csvFilename as stock |<---------|reuire("mongodb")     |
     | ________|     |      as  stock ID       |          |______________________|
                     |                         |              __________________________             _______________________
                     |                         |   filter    |                          |   filter   |                      |
                     |                         | ----------->|db.col.find({ID:ID,....}) |----------->|{ID:"000001.SZ",.....}|
                     |_________________________|             |__________________________|            |______________________|
