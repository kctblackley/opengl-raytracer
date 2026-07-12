#ifndef VAO_H
#define VAO_H
#pragma once

#include <glad/glad.h>
#include "VBO.h"

class VAO {
public:
	GLuint ID;

	VAO();

	void linkAttrib(VBO VBO, GLuint layout, GLuint numComponents, GLenum type, GLsizeiptr stride, void* offset);
	void bindVAO();
	void unbindVAO();
	void deleteVAO();
};

#endif