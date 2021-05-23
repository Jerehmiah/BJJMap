package models

type Annotation struct {
	Text        string         `form:"text" json:"text"`
	Vertex      Vertex         `form:"vertex" json"vertex"`
}