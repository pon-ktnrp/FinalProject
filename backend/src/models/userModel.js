const userSchema = {
    username : "String" ,
    password : "String"
};

class User{
    constructor(username,password){
        this.username = username;
        this.password = password;
    }
}