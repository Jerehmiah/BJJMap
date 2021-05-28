package models

type Vertex struct {
	X  float64            `form:"x" json:"x"`
	Y  float64            `form:"y" json:"y"`
	Z  float64            `form:"z" json:"z"`    
}