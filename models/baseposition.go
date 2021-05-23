package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Baseposition struct {
	Id          bson.ObjectId  `json:"id" bson:"_id"`
	Owner        string        `form:"owner" json:"owner"`
	PositionId  bson.ObjectId  `form:"positionid" json:"positionid"`

}