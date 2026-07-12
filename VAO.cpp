#include "VAO.h"

VAO::VAO() {
	glGenVertexArrays(1, &ID);
}

void VAO::linkAttrib(VBO VBO, GLuint layout, GLuint numComponents, GLenum type, GLsizeiptr stride, void* offset) {
	VBO.bindVBO();
	if (type != GL_FLOAT) {
		glVertexAttribPointer(layout, numComponents, type, GL_TRUE, stride, offset);
	} else {
		glVertexAttribPointer(layout, numComponents, type, GL_FALSE, stride, offset);
	}
	glEnableVertexAttribArray(layout);
}


void VAO::bindVAO() {
	glBindVertexArray(ID);
}

void VAO::unbindVAO() {
	glBindVertexArray(0);
}

void VAO::deleteVAO() {
	glDeleteVertexArrays(1, &ID);
}