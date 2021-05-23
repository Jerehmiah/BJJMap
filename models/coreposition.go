package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Coreposition struct {
	Id          bson.ObjectId  `json:"id" bson:"_id"`
	Name        string         `form:"name" json:"name"`
	Thumb       string         `form:"thumb" json:"thumb"`
	Botcolor    string         `form:"botcolor" json:"botcolor"`
	Description string         `form:"description" json:"description"`
	GLTF        string         `form:"gltf" json:"gltf"`
}