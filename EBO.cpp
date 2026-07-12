#include "EBO.h"

EBO::EBO(GLuint* indices, GLsizeiptr size, GLenum bufferType) {
	glGenBuffers(1, &ID);
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ID);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, size, indices, bufferType);
}

void EBO::bindEBO() {
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ID);
}

void EBO::unbindEBO() {
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
}

void EBO::deleteEBO() {
	glDeleteBuffers(1, &ID);
}