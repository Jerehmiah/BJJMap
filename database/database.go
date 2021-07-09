package database

import (  
    "gopkg.in/mgo.v2"
    "os"
)

func Database() *mgo.Session {  
    session, err := mgo.Dial(os.Getenv("MAIN_DB_NAME"))

    if err != nil {
        panic(err)
    }

    session.SetMode(mgo.Monotonic, true)

    return session
}