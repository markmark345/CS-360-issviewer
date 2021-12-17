const request = require("supertest");

const {getTle, saveTle, getLocation, saveLocation} = require('../cache')
const eciVelocityToKmph = require('../app.js')
const tleStringToArray = require('../app.js')
const tleArrayToString = require('../app.js')
const getCurrentPosition = require('../app')
const startLoadTleData = require('../app')
const server = require('../app')


describe("Test cache.js", () => {

    describe("getTle", () => {
        test("expect get data from radis", async () => {
            const data = await getTle();
            expect(data).not.toBeNull();
        });
    });

    describe("getLocation", () => {
        test('expect output consol.log from get location ', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const data = await getLocation("bangkok");
          
            expect(consoleSpy).toHaveBeenCalledWith('location data from redis ', data);
          });

    });
});

describe("Test app.js", () => {

    test("It should response the GET method", done => {
        request(server)
          .get("/")
          .then(response => {
            expect(response.statusCode).toBe(200);
            done();
          });
      });

      test("Expect track return 200", done => {
        request(server)
          .get("/track")
          .then(response => {
            expect(response.statusCode).toBe(200);
            done();
          });
      });
      test("Expect predict bangkok return status 200", done => {
        request(server)
          .get("/predict/bangkok")
          .then(response => {
            expect(response.statusCode).toBe(200);
            done();
          });
      });

    describe("Velocity to Kmph", () => {
        test("expect Velocity x=1, y=1, z=1 to Kmph equal 6235.382907247958",  () => {
            const eci = eciVelocityToKmph.__get__('eciVelocityToKmph');
            expect(eci({'x':1, 'y':1, 'z':1})).toEqual(6235.382907247958);
        });
    });

    describe("tleStringToArray", () => {
        test("expect equal ['x','y','z']",  () => {
            const tsa = tleStringToArray.__get__('tleStringToArray');
            expect(
                tsa("ISS (ZARYA)\n1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999\n2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109\n"))
                .toEqual(["ISS (ZARYA)","1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999", "2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109"]);
        });
    });

    describe("tleArrayToString", () => {
        test("expect equal xyz",  () => {
            const tsa = tleArrayToString.__get__('tleArrayToString');
            expect(
                tsa(["ISS (ZARYA)","1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999", "2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109"]))
                .toEqual("ISS (ZARYA)\n1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999\n2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109");
        });
    });

    describe("startLoadTleData", () => {
        test("expect console log out equal ", async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const sld = startLoadTleData.__get__('startLoadTleData');
            const data = await sld();
            expect(consoleSpy).toHaveBeenLastCalledWith("cached TLE is recent enough and will be used");
            console.log(data);
        });
    });

    describe("getCurrentPosition", () => {
        test('expect data height more than 0', async () => {
            const gcp = await getCurrentPosition.__get__('getCurrentPosition');
            const data = gcp();
            console.log("data = ",data);
            console.log("data.ve = ",data.velocityKmph);
            expect(data.velocityKmph).toBeGreaterThan(1);
          });
    });
});