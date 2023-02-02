const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const aws = require("aws-sdk");
const bcrypt= require("bcrypt")
const validation = require("../validations/validation");

aws.config.update({
  accessKeyId: "AKIAY3L35MCRZNIRGT6N",
  secretAccessKey: "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",
  region: "ap-south-1",
});

let uploadFile = async (file) => {
  return new Promise(function (resolve, reject) {
    let s3 = new aws.S3({ apiVersion: "2006-03-01" });

    var uploadParams = {
      ACL: "public-read", //Access Control Locator
      Bucket: "classroom-training-bucket",
      Key: "abc/" + file.originalname,
      Body: file.buffer,
    };

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ error: err });
      }
      //   console.log(data);
      console.log("file uploaded succesfully");
      return resolve(data.Location);
    });
  });
};

const register = async (req, res) => {
  // there are 3 problems have to resolve ==> 1. address , fname validation , bycrpt
  try {
    let userData = req.body;

    let { fname, lname, email, profileImage, phone, password, address } =
      userData;

    if (Object.keys(userData).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "please provide required fields" });
    }

    //============ fname====================

    if (!fname) {
      return res
        .status(400)
        .send({ status: false, message: "first name is mandatory" });
    }
    if (typeof fname != "string") {
      return res
        .status(400)
        .send({ status: false, message: "first name should be in string" });
    }
    // regex
    fname = userData.fname = fname.trim();

    if (fname == "")
      return res
        .status(400)
        .send({ status: false, message: "Please Enter first name value" });

    if (!validation.validateName(fname)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid first name " });
    }

    // ========================= lname ==================

    if (!lname) {
      return res
        .status(400)
        .send({ status: false, message: "last name is mandatory" });
    }
    if (typeof lname != "string") {
      return res
        .status(400)
        .send({ status: false, message: "last name should be in string" });
    }
    // regex
    lname = userData.lname = lname.trim();
    if (lname == "")
      return res
        .status(400)
        .send({ status: false, message: "Please enter last name value" });
    if (!validation.validateName(lname)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid last  name " });
    }

    //================================ email ======

    if (!email) {
      return res
        .status(400)
        .send({ status: false, message: "email is mandatory" });
    }
    if (typeof email != "string") {
      return res
        .status(400)
        .send({ status: false, message: "email id  should be in string" });
    }

    //=========== email =======

    email = userData.email = email.trim();
    if (email == "")
      return res
        .status(400)
        .send({ status: false, message: "Please enter email" });
    if (!validation.validateEmail(email)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid email id" });
    }

    //======= phone =============

    if (!phone) {
      return res
        .status(400)
        .send({ status: false, message: "phone is mandatory" });
    }
    if (typeof phone != "string") {
      return res
        .status(400)
        .send({ status: false, message: "phone should be in string" });
    }
    phone = userData.phone = phone.trim();

    if (phone == "")
      return res
        .status(400)
        .send({ status: false, message: "Please enter phone" });
 

    // if (!validation.validateMobileNo(phone)) {
    //   return res.status(400).send({
    //     status: false,
    //     message: "please provide valid 10 digit Phone Number",
    //   });
    // }

    const userExist = await userModel.findOne({
      $or: [{ email: email }, { phone: phone }],
    });

    if (userExist) {
      if (userExist.email == email) {
        return res
          .status(400)
          .send({ status: false, message: "email id  already exist" });
      }

      if (userExist.phone == phone) {
        return res
          .status(400)
          .send({ status: false, message: "phone  already exist" });
      }
    }

    //========= password ======

    if (!password) {
      return res
        .status(400)
        .send({ status: false, message: "password is mandatory" });
    }

    if (typeof password != "string") {
      return res
        .status(400)
        .send({ status: false, message: "please provide password in string " });
    }

    password = userData.password = password.trim();

    if (password == "") {
      return res
        .status(400)
        .send({ status: false, message: "Please provide password value" });
    }


    //regex

    if (!validation.validatePassword(password)) {
      return res.status(400).send({
        status: false,
        message:
          "please provide valid Alphanumeric 8-15 length Atleast One Special character password",
      });
    }

    // bycrypt part password in
    const saltrounds=10;
    bcrypt.hash(password, saltrounds ,function(err, hash){
        if(hash) userData.password=hash;
        else return res.status(400).send({status:false, message:"please send another password"})
    })


    //======================== address =============

    //  there is two condition to take address 1 make it mandatory or optional like if(address){} then ....

    //========= checking both condition ======

    address = userData.address = JSON.parse(address);

    if (!address) {
      return res
        .status(400)
        .send({ status: false, message: "Address is mandatory " });
    }

    // console.log(typeof address);
    if (typeof address != "object")
      return res.status(400).send({
        status: false,
        message: "Address should be in Object format ",
      });

    // if (address) {
    // ======== address  shipping ============

    // if (address.shipping) {
    // checking.....

    if (!address.shipping) {
      return res
        .status(400)
        .send({ status: false, message: "Shipping Address is mandatory " });
    }

    if (typeof address.shipping != "object")
      return res.status(400).send({
        status: false,
        message: "Address should be in Object format ",
      });

    if (!address.shipping.street) {
      return res
        .status(400)
        .send({ status: false, message: "shipping street is mandatory " });
    }

    if (typeof address.shipping.street != "string") {
      return res.status(400).send({
        status: false,
        message: "shipping street  will be in string ",
      });
    }

    address.shipping.street = address.shipping.street.trim();

    if (address.shipping.street == "") {
      return res.status(400).send({
        status: false,
        message: "Please provide shipping value",
      });
    }
    //validate street

    //=== city

    if (!address.shipping.city) {
      return res
        .status(400)
        .send({ status: false, message: "shipping city is mandatory " });
    }
    if (typeof address.shipping.city != "string") {
      return res.status(400).send({
        status: false,
        message: "shipping city will be in string ",
      });
    }
    address.shipping.city = address.shipping.city.trim();

    if (address.shipping.city == "") {
      return res.status(400).send({
        status: false,
        message: "Please provide city value",
      });
    }
    //validate city

    //====pincode

    if (!address.shipping.pincode) {
      return res.status(400).send({
        status: false,
        message: "shipping pincode is mandatory ",
      });
    }
    if (typeof address.shipping.pincode != "number") {
      return res.status(400).send({
        status: false,
        message: "shipping pincode  will be in number ",
      });
    }
    // }

    //====== address billing ====

    // if (address.billing) {
    // checking .....
    if (!address.billing) {
      return res
        .status(400)
        .send({ status: false, message: "billing Address is mandatory " });
    }
    if(typeof (address.billing) != "object" ){
      return res.status(400).send({status:false, message:"billing address should be in the object format"})
    }
    if (!address.billing.street) {
      return res
        .status(400)
        .send({ status: false, message: "billing street is mandatory " });
    }
    if (typeof address.shipping.street != "string") {
      return res.status(400).send({
        status: false,
        message: "billing street  will be in string ",
      });
    }
    address.shipping.street= address.shipping.street.trim()
    if(address.shipping.street == "") return res.status(400).send({status:false, message:"please provide shipping street"})

    //=== city
    if (!address.billing.city) {
      return res
        .status(400)
        .send({ status: false, message: "billing city  is mandatory " });
    }
    if (typeof address.shipping.city != "string") {
      return res.status(400).send({
        status: false,
        message: "billing city  will be in string ",
      });
    }
    address.shipping.city= address.shipping.city.trim()
    if(address.shipping.city == "") return res.status(400).send({status:false, message:"please provide shipping city"})
    //====pincode

    if (!address.billing.pincode) {
      return res
        .status(400)
        .send({ status: false, message: "billing pincode  is mandatory " });
    }
    if (typeof address.shipping.pincode != "number") {
      return res.status(400).send({
        status: false,
        message: "billing pincode  will be in number ",
      });
      // }
    }

    profileImage = req.files;

    if (Object.keys(profileImage).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please upload Profile Image" });
    }

    let image = await uploadFile(profileImage[0]);

    userData.profileImage = image;

    const usercreated = await userModel.create(userData);

    return res.status(201).send({ status: true, data: usercreated });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ status: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    let data = req.body;
    if (Object.keys(data) == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please send data" });
    let { email, password } = data;

    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "Please enter Emaill" });

    if (email != undefined && typeof email != "string")
      return res
        .status(400)
        .send({ status: false, message: "Please enter Emaill in string format" });

        data.email = email.trim();

    if (email == "")
      return res
        .status(400)
        .send({ status: false, message: "Please enter Email" });

    if (!validation.validateEmail(email))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid Email" });

    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "Please enter password" });

    if (password != undefined && typeof password != "string")
      return res
        .status(400)
        .send({ status: false, message: "Please enter password in string format" });

    data.password = password.trim();

    if (password == "")
      return res
        .status(400)
        .send({ status: false, message: "Please enter password" });

    if (!validation.validatePassword(password))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid password" });

        

    let isUserExist = await userModel.findOne({
      email: email,
      password: password,
    });

    bcrypt.compare(password, isUserExist.password, function(err, matched){
      if(err) return res.status(400).send({status:false, message:"Please enter valid password"})
    })

    if (!isUserExist)
      return res.status(404).send({
        status: false,
        message: "No user found with given credentials ",
      });

    let token = jwt.sign(
      { userId: isUserExist._id, exp: Math.floor(Date.now() / 1000) + 5 },
      "project5"
    );
    let tokenInfo = { userId: isUserExist._id, token: token };

    res.status(200).send({
      status: true,
      message: "User login successfully",
      data: tokenInfo,
    });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};

module.exports = { loginUser, register };
