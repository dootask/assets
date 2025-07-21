package utils

import (
	dootask "github.com/dootask/tools/server/go"
)

type DooTaskClient struct {
	Client *dootask.Client
}

// NewDooTaskClient 创建 DooTask 客户端
func NewDooTaskClient(token string, server ...string) DooTaskClient {
	if len(server) > 0 {
		return DooTaskClient{Client: dootask.NewClient(token, dootask.WithServer(server[0]))}
	}
	return DooTaskClient{Client: dootask.NewClient(token)}
}
