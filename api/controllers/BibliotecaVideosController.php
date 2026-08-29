<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class BibliotecaVideosController {
    private $video;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->video = new BibliotecaVideos($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->video->read($id_usuario);
        
        $videos = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['assistido'] = (bool)$row['assistido'];
            $row['nota'] = (int)$row['nota'];
            
            // Aliases para camelCase do frontend
            $row['videoId'] = $row['video_id'];
            $row['dataAdicionado'] = $row['data_adicionado'];
            
            array_push($videos, $row);
        }
        
        echo json_encode($videos);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->video->id_video = $id;
        $this->video->id_usuario = $id_usuario;
        
        if($this->video->readOne()) {
            echo json_encode([
                "id_video" => $this->video->id_video,
                "id_usuario" => $this->video->id_usuario,
                "materia" => $this->video->materia,
                "titulo" => $this->video->titulo,
                "url" => $this->video->url,
                "video_id" => $this->video->video_id,
                "videoId" => $this->video->video_id,
                "thumbnail" => $this->video->thumbnail,
                "tema" => $this->video->tema,
                "anotacoes" => $this->video->anotacoes,
                "assistido" => (bool)$this->video->assistido,
                "nota" => (int)$this->video->nota,
                "data_adicionado" => $this->video->data_adicionado,
                "dataAdicionado" => $this->video->data_adicionado
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Vídeo não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->titulo) || empty($data->url)) {
            http_response_code(400);
            echo json_encode(["message" => "Título e URL são obrigatórios"]);
            return;
        }
        
        $this->video->id_usuario = $id_usuario;
        $this->video->materia = $data->materia ?? 'Geral';
        $this->video->titulo = $data->titulo;
        $this->video->url = $data->url;
        $this->video->video_id = $data->videoId ?? '';
        $this->video->thumbnail = $data->thumbnail ?? '';
        $this->video->tema = $data->tema ?? 'Geral';
        $this->video->anotacoes = $data->anotacoes ?? '';
        $this->video->assistido = isset($data->assistido) ? (int)$data->assistido : 0;
        $this->video->nota = $data->nota ?? 0;
        
        $data_adicionado = $data->dataAdicionado ?? date('Y-m-d H:i:s');
        $timestamp = strtotime($data_adicionado);
        $this->video->data_adicionado = ($timestamp !== false) ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');
        
        if($this->video->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Vídeo criado com sucesso",
                "id_video" => $this->video->id_video
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar vídeo."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->video->id_video = $id;
        $this->video->id_usuario = $id_usuario;
        
        if(!$this->video->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Vídeo não encontrado"]);
            return;
        }
        
        $this->video->materia = $data->materia ?? $this->video->materia;
        $this->video->titulo = $data->titulo ?? $this->video->titulo;
        $this->video->url = $data->url ?? $this->video->url;
        $this->video->video_id = $data->videoId ?? $this->video->video_id;
        $this->video->thumbnail = $data->thumbnail ?? $this->video->thumbnail;
        $this->video->tema = $data->tema ?? $this->video->tema;
        $this->video->anotacoes = $data->anotacoes ?? $this->video->anotacoes;
        $this->video->assistido = isset($data->assistido) ? (int)$data->assistido : (int)$this->video->assistido;
        $this->video->nota = isset($data->nota) ? (int)$data->nota : (int)$this->video->nota;
        
        if($this->video->update()) {
            echo json_encode(["message" => "Vídeo atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar vídeo."]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->video->id_video = $id;
        $this->video->id_usuario = $id_usuario;
        
        if($this->video->delete()) {
            echo json_encode(["message" => "Vídeo deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar vídeo."]);
        }
    }
}
?>
