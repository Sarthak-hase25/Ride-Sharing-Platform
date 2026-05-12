const MongoStore = require('connect-mongo');
console.log('MongoStore.MongoStore keys:', Object.keys(MongoStore.MongoStore || {}));
console.log('MongoStore.create keys:', Object.keys(MongoStore.create || {}));
if (MongoStore.MongoStore && MongoStore.MongoStore.create) {
    console.log('MongoStore.MongoStore.create is a function');
}
