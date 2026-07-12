#include "VBO.h"

VBO::VBO(GLfloat* vertices, GLsizeiptr size, GLenum bufferType) {
	glGenBuffers(1, &ID);
	glBindBuffer(GL_ARRAY_BUFFER, ID);
	glBufferData(GL_ARRAY_BUFFER, size, vertices, bufferType);
}

void VBO::bindVBO() {
	glBindBuffer(GL_ARRAY_BUFFER, ID);
}

void VBO::unbindVBO() {
	glBindBuffer(GL_ARRAY_BUFFER, 0);
}

void VBO::deleteVBO() {
	glDeleteBuffers(1, &ID);
}