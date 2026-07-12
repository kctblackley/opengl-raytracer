#ifndef EBO_H
#define EBO_H
#pragma once

#include <glad/glad.h>

class EBO {
public:
	GLuint ID;

	EBO(GLuint* indices, GLsizeiptr size, GLenum bufferType = GL_STATIC_DRAW);

	void bindEBO();
	void unbindEBO();
	void deleteEBO();
};

#endif