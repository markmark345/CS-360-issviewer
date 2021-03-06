const redis = require("redis");

const REDIS_PORT = 6379;
const redisClient = redis.createClient(REDIS_PORT);//, '127.0.0.1'); //'redis-server' ); // เพิ่ม host redis แทน 127.0.0.1 process.env.REDIS_HOST || '127.0.0.1'

module.exports =
{
	getTle: () =>
	{
		return new Promise(resolve =>
		{
			redisClient.get("tledata:iss", (err, data) =>
			{
				if (err) throw err;

				resolve(data);
			});
		});
	},

	saveTle: (tleString) =>
	{
		redisClient.set("tledata:iss", tleString);
	},

	getLocation: (locationName) =>
	{
		return new Promise(resolve =>
		{
			redisClient.hgetall(`location:${locationName}`, (err, data) =>
			{
				if (err) throw err;
				
				if (data != null)
					console.log("location data from redis ", data);
				resolve(data);
			});
		});
	},

	saveLocation: (locationName, location) =>
	{
		redisClient.hmset(`location:${locationName}`, location);
	},

	close: () => {
		redisClient.quit();
	}
};