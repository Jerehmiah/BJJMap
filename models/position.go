package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Position struct {
	Id          bson.ObjectId  `json:"id" bson:"_id"`
	Owner       string         `form:"owner" json:"owner"`
	Public      bool           `bson:",omitempty" json:"public"`
	Transitions []Position     `bson:",omitempty" form:"transitions" json:"transitions"`
	Annotations []Annotation   `form:"annotations" json:"annotations"`
	GLTF        string         `form:"gltf" json:"gltf"`
}