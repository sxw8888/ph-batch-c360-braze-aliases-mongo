describe('requestHandler', () =>{
    const RequestHandler = require('handler/requestHandler');

    it('Success Response ', async()=>{
        const fromDate = '2019-04-14'
        let res = await RequestHandler.realTimePushToBraze(fromDate);
        console.log('res',res);

    })
})