package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Vertex struct {
	Id bson.ObjectId  `json:"id" bson:"_id"`
	X  int            `form:"x" json:"x"`
	Y  int            `form:"y" json:"y"`
	Z  int            `form:"z" json:"z"`    
}