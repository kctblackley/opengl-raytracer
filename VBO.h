#ifndef VBO_H
#define VBO_H
#pragma once

#include <glad/glad.h>

class VBO {
public:
	GLuint ID;

	VBO(GLfloat* vertices, GLsizeiptr size, GLenum bufferType = GL_STATIC_DRAW);

	void bindVBO();
	void unbindVBO();
	void deleteVBO();
};

#endif