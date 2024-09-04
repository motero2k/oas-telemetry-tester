
export const logger = {
    log: function (...message: any) {
        let time = new Date().toISOString();
        console.log(time + ":", ...message);
    },
    //varargs
    error: function (...message: any) {
        let time = new Date().toISOString();
        console.error(time + ":", ...message);
    }
}