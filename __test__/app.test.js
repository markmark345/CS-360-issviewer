/** คำอธิบายระบบ 12/20/2021
 * ระบบ ISS viewer นี้เป็นแอพพลิเคชั่นในการค้นหาสถานนีอวากาศ ISS 
 * และยังสามารถคาดการณ์ตํ่าแหน่งของสถานนี ISS ที่จะไปปรากฎทั้งยังสามมารถ
 * ติดตามสถานี ISS ในตํ่าแหน่งปัจจุบันแบบ real time ได้อีกด้วย
 * หลังจากนี้จะเป็นการอธิบาย Test case ว่าทดสอบอะไรไปบ้างทดสอบส่วนไหนบ้าง
 * ไฟล์ ที่ได้นำมา Test จะมีทั้งหมด 2 ไฟล์ได้แก่
 * 1. app.js
 * 2. cache.js
 * ขั้นตอนการทำงานจะยิงข้อมูลไปที่เว็ปไซต์เพื่อมาเก็บไว้ที่ Cache server ตามช่วงเวลา
 */

// เป็นการ Import module จาก supertest
const request = require("supertest");
// เป็นการ import module จาก cache.js
const {getTle, saveTle, getLocation, saveLocation} = require('../cache')
// เป็นการ import module จาก app.js
const eciVelocityToKmph = require('../app.js')
const tleStringToArray = require('../app.js')
const tleArrayToString = require('../app.js')
const getCurrentPosition = require('../app')
const startLoadTleData = require('../app')
const {app, gracefulShutdown} = require('../app')

// ตรงส่วนนี้จะเป็นก่อนที่จะเริ่มทำการเทสจะดึงข้อมูลไปเก็บไว้ที่แคชก่อน
beforeAll(async () => {
    console.log("Before All")
    const sld = startLoadTleData.__get__('startLoadTleData');
    await sld();
  });

// หลังสิ้นสุดการเทสจะทำการยกเลิก interval และปิด redis กับ server
afterAll((done) => {
    gracefulShutdown();
    done();
});

// ส่วนนี้จะเป็นการเทสระบบการทำงานใน app.js
describe("Test HTTP operation (app.js)", () => {
   
    // ป็นการ test ยิงไปที่ "/" ควรจะส่ง response กลับมาเป็น 200
    test("It should response the GET method", async () => {
        await request(app)
          .get("/")
          .then(response => {
            expect(response.statusCode).toBe(200);
          });
      });

      // เป็นการ test ยิงไปที่ "/track" ควรจะส่ง response กลับมาเป็น 200
      test("Expect track return 200", async () => {
        await request(app)
          .get("/track")
          .then(response => {
            expect(response.statusCode).toBe(200);
          });
      });

      // เป็นการ test ยิงไปที่ "/predict/bangkok" ควรจะส่ง response กลับมาเป็น 200
      test("Expect predict bangkok return status 200", async () => {
        await request(app)
          .get("/predict/bangkok")
          .then(response => {
            expect(response.statusCode).toBe(200);
          });
      });

      // Test ฟังก์ชั่นในการคำนวนเปลียน Velocity เป็น Kmph 
    describe("Velocity to Kmph", () => {
        // ทำการทดสอบในส่วนแกน x, y, z เป็น 1 จะได้ Kmph เป็น 6235.382907247958
        test("expect Velocity x=1, y=1, z=1 to Kmph equal 6235.382907247958",  () => {
            const eci = eciVelocityToKmph.__get__('eciVelocityToKmph');
            expect(eci({'x':1, 'y':1, 'z':1})).toEqual(6235.382907247958);
        });
    });

    // Test ฟังก์ชั่นในการเปลี่ยนข้อความให้เป็นชุุดข้มูล Array
    describe("tleStringToArray", () => {
        // ทำการทดสอบว่าข้อมูลจะออกมาใน array รูปแบบ ['x','y','z'] นี้ไหม
        test("expect equal ['x','y','z']",  () => {
            const tsa = tleStringToArray.__get__('tleStringToArray');
            expect(
                tsa("ISS (ZARYA)\n1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999\n2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109\n"))
                .toEqual(["ISS (ZARYA)","1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999", "2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109"]);
        });
    });

    // Test ฟังก์ชั่นในการเปลี่ยนชุดข้อมูล Array ให้เป็นชุุดข้อความ
    describe("tleArrayToString", () => {
        // ทำการทดสอบว่าข้อมูลจะออกมาในรูปแบบ xyz นี้ไหม
        test("expect equal xyz",  () => {
            const tsa = tleArrayToString.__get__('tleArrayToString');
            expect(
                tsa(["ISS (ZARYA)","1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999", "2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109"]))
                .toEqual("ISS (ZARYA)\n1 25544U 98067A   21345.67957230  .00001207  00000+0  30117-4 0  9999\n2 25544  51.6421 185.0825 0004037 299.0969 176.5667 15.48957922316109");
        });
    });

    // Test ฟังก์ชั่นการ start โหลดข้อมูล TLE เข้าสู่ Cache   
    describe("startLoadTleData", () => {
        // test ผล output จาก consol.log ว่าข้อมูลพ้อมใช้งาน 
        test("expect console log containing ", async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const sld = startLoadTleData.__get__('startLoadTleData');
            const data = await sld();

            expect(consoleSpy).toHaveBeenLastCalledWith("cached TLE is recent enough and will be used");
            console.log(data);
        });
    });

    // Test ฟังก์ชั่นดึงค่า position ปัจจุบันของ ISS
    describe("getCurrentPosition", () => {
        // ข้อมูลที่ได้รับมาความเร็ว Kmph ต้องมากกว่า 1000
        test('expect data velocity (Kmph) more than 1000', async () => {
            const gcp = getCurrentPosition.__get__('getCurrentPosition');
            const data = await gcp();
            console.log("data = ",data);
            console.log("data.ve = ",data.velocityKmph);
            expect(data.velocityKmph).toBeGreaterThan(1000);
          });

          // ข้อมูลที่ได้รับมาความสูงต้องมากกว่า 300
          test('expect data height more than 300', async () => {
            const gcp = getCurrentPosition.__get__('getCurrentPosition');
            const data = await gcp();
            console.log("data = ",data);
            console.log("data.ve = ",data.height);
            expect(data.height).toBeGreaterThan(300);
          });

          // ข้อมูลที่ได้รับมา lat lon ต้องไม่เป็นค่า null
          test('expect data lat lon not to be null', async () => {
            const gcp = getCurrentPosition.__get__('getCurrentPosition');
            const data = await gcp();
            expect(data.lat).not.toBeNull();
            expect(data.lon).not.toBeNull();
          });
    });
    
});

// ส่วนนี้จะเป็นการเทสระบบการทำงานใน cache.js
describe("Test Redis Operation (cache.js)", () => {

    // เป็นฟังก์ชั่นในการดึงข้อมูลจาก cache
    describe("getTle", () => {
        // เป็นการทดสอบดึงข้อมูลมาแล้วไม่เป็น null
        test("expect get data from radis", async () => {
            const data = await getTle();
            expect(data).not.toBeNull();
        });
    });

    // เป็นฟังก์ชั่นในการดึงข้อมูล location จาก cache
    describe("getLocation", () => {
        // เป็นการทดสอบ consol.log ว่าต้องมี output แบบนี้ location data from redis เมื่อเราทำการค้นหาด้วย bangkok
        test('expect output consol.log from get location ', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const data = await getLocation("bangkok");
          
            expect(consoleSpy).toHaveBeenCalledWith('location data from redis ', data);
          });

    });
});
